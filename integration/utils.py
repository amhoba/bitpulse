#!/usr/bin/env python3

import yaml
import re
from typing import List
import subprocess


def extract_compose_service_names(compose_files: List[str]):

    service_names = []

    for compose_file in compose_files:
        with open(compose_file, 'r') as ymlfile:
            docker_config = yaml.safe_load(ymlfile)
            services = docker_config['services']
            for service_name, service_config in services.items():
                if service_name not in service_names:
                    service_names.append(service_name)

    return service_names


def extract_compose_volume_names(compose_files: List[str], project_name: str):

    volume_names = []

    for compose_file in compose_files:
        with open(compose_file, 'r') as ymlfile:
            docker_config = yaml.safe_load(ymlfile)
            # Check for yaml files that do not have 'volumes' directive
            if 'volumes' not in docker_config:
                continue
            # Continue with the rest
            volumes = docker_config['volumes']
            for volume_name, volume_config in volumes.items():
                volume_name = project_name + "_" + volume_name
                if volume_name not in volume_names:
                    volume_names.append(volume_name)

    return volume_names


def extract_yaml_files_from_base_command(base_command: str):
    regex = r"-f (.*?\.yml)"
    return re.findall(regex, base_command)


def extract_project_name_from_base_command(base_command: str):
    regex = r"-p\s(.*?)\s"
    return re.findall(regex, base_command)[0]


def check_output(command: str):
    return subprocess.check_output(command, shell=True).decode()
