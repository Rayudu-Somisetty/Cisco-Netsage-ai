#!/usr/bin/env python3
"""Deterministic topology checks for NetSage AI."""
import ipaddress
import json
import sys
from typing import Any


def result(check_id: str, label: str, status: str, detail: str) -> dict[str, str]:
    return {"id": check_id, "label": label, "status": status, "detail": detail}


def parse_ip(value: str) -> ipaddress.IPv4Address | None:
    try:
        return ipaddress.ip_address(value) if value else None
    except ValueError:
        return None


def parse_network(node: dict[str, Any]) -> ipaddress.IPv4Network | None:
    address = parse_ip(node.get("ip", ""))
    try:
        mask = ipaddress.ip_network(f"0.0.0.0/{node.get('subnet', '')}").netmask
        return ipaddress.ip_network(f"{address}/{mask}", strict=False) if address else None
    except ValueError:
        return None


def check_duplicate_ips(nodes: list[dict[str, Any]]) -> dict[str, str]:
    seen: dict[str, list[str]] = {}
    for node in nodes:
        ip = node.get("ip", "").strip()
        if ip:
            seen.setdefault(ip, []).append(node.get("name", node.get("id", "node")))
    duplicates = {ip: names for ip, names in seen.items() if len(names) > 1}
    if duplicates:
        details = "; ".join(f"{ip} ({', '.join(names)})" for ip, names in duplicates.items())
        return result("dup_ip", "Duplicate IP", "fail", f"Duplicate addresses found: {details}")
    return result("dup_ip", "Duplicate IP", "pass", "No duplicate IP addresses found")


def check_gateways(nodes: list[dict[str, Any]]) -> dict[str, str]:
    failures = []
    for node in nodes:
        gateway = node.get("gateway", "").strip()
        if not gateway:
            continue
        gateway_ip = parse_ip(gateway)
        network = parse_network(node)
        if gateway_ip is None or network is None or gateway_ip not in network:
            failures.append(f"{node.get('name', node.get('id'))}: gateway {gateway} is outside its subnet")
    if failures:
        return result("gw_mismatch", "Gateway Mismatch", "fail", "; ".join(failures))
    return result("gw_mismatch", "Gateway Mismatch", "pass", "Configured gateways are valid for their subnets")


def check_subnets(nodes: list[dict[str, Any]]) -> dict[str, str]:
    failures = []
    networks = []
    for node in nodes:
        address = parse_ip(node.get("ip", ""))
        subnet = node.get("subnet", "")
        try:
            network = ipaddress.ip_network(f"0.0.0.0/{subnet}")
            if address is None:
                failures.append(f"{node.get('name', node.get('id'))}: invalid IP address")
            networks.append((node, network))
        except ValueError:
            failures.append(f"{node.get('name', node.get('id'))}: invalid or non-contiguous subnet mask {subnet}")
    for index, (left, left_network) in enumerate(networks):
        for right, right_network in networks[index + 1:]:
            if left.get("ip") and left.get("ip") == right.get("ip"):
                continue
            if left.get("parentId") == right.get("id") or right.get("parentId") == left.get("id"):
                if left_network.prefixlen != right_network.prefixlen and left_network.overlaps(right_network):
                    failures.append(f"Parent/child subnet overlap: {left.get('name')} and {right.get('name')}")
    if failures:
        return result("wrong_subnet", "Wrong Subnet", "fail", "; ".join(failures))
    return result("wrong_subnet", "Wrong Subnet", "pass", "IP addresses and subnet masks are consistent")


def check_interfaces(nodes: list[dict[str, Any]]) -> dict[str, str]:
    failures = []
    for node in nodes:
        for interface in node.get("interfaces", []):
            if str(interface.get("status", "")).upper() == "DOWN":
                failures.append(f"{node.get('name', node.get('id'))}:{interface.get('name', 'interface')} is DOWN")
    if failures:
        return result("if_down", "Interface Down", "fail", "; ".join(failures))
    return result("if_down", "Interface Down", "pass", "All configured interfaces are UP")


def check_vlans(nodes: list[dict[str, Any]]) -> dict[str, str]:
    failures = []
    by_id = {node.get("id"): node for node in nodes}
    for node in nodes:
        for interface in node.get("interfaces", []):
            if not str(interface.get("vlan", "")).strip():
                failures.append(f"{node.get('name', node.get('id'))}:{interface.get('name', 'interface')} has no VLAN")
        parent = by_id.get(node.get("parentId"))
        if parent and node.get("interfaces") and parent.get("interfaces"):
            child_vlans = {v.strip() for item in node["interfaces"] for v in str(item.get("vlan", "")).split(",") if v.strip()}
            parent_vlans = {v.strip() for item in parent["interfaces"] for v in str(item.get("vlan", "")).split(",") if v.strip()}
            if child_vlans and parent_vlans and not child_vlans.intersection(parent_vlans):
                failures.append(f"{node.get('name', node.get('id'))} VLANs do not overlap parent {parent.get('name', parent.get('id'))}")
    if failures:
        return result("missing_vlan", "Missing VLAN", "fail", "; ".join(failures))
    return result("missing_vlan", "Missing VLAN", "pass", "Configured interfaces have compatible VLAN membership")


def check_route(payload: dict[str, Any], nodes: list[dict[str, Any]]) -> dict[str, str]:
    source_id = payload.get("sourceNodeId")
    target_id = payload.get("targetNodeId")
    source = next((node for node in nodes if node.get("id") == source_id), None)
    target = next((node for node in nodes if node.get("id") == target_id), None)
    output = str(payload.get("commandOutput", "")).lower()
    if not source or not target or not source.get("ip") or not target.get("ip"):
        return result("missing_route", "Missing Route", "warning", "A source and target node are required to verify routing")
    source_network = parse_network(source)
    target_ip = parse_ip(target["ip"])
    if source_network and target_ip in source_network:
        return result("missing_route", "Missing Route", "pass", "Target is directly reachable on the source subnet")
    if "0.0.0.0/0" in output or "gateway of last resort" in output and "not set" not in output:
        return result("missing_route", "Missing Route", "pass", "Command output includes a default route")
    return result("missing_route", "Missing Route", "fail", "No route to the target subnet or default route was found")


def main() -> None:
    payload = json.load(sys.stdin)
    nodes = payload.get("topology") or []
    checks = [
        check_duplicate_ips(nodes),
        check_gateways(nodes),
        check_subnets(nodes),
        check_interfaces(nodes),
        check_vlans(nodes),
        check_route(payload, nodes),
    ]
    print(json.dumps(checks))


if __name__ == "__main__":
    main()
