#!/usr/bin/env python3

import typer
import os

import utils


def setup_typer_app(base_command: str):

    app = typer.Typer(no_args_is_help=True)

    @app.command()
    def build(
        plain: bool = typer.Option(False),
        nocache: bool = typer.Option(False),
        name: str = typer.Option(
            None,
            help="service name to build",
            autocompletion=lambda: utils.extract_compose_service_names(
                utils.extract_yaml_files_from_base_command(base_command)
            )
        )
    ):
        os.system(f"{base_command} build" + (" --progress=plain" if plain else "") + (" --no-cache" if nocache else "") + (f" {name}" if name else ""))


    @app.command()
    def setup():
        os.system(f"{base_command} up setup")


    @app.command()
    def start():
        os.system(f"{base_command} up -d --no-recreate")


    @app.command()
    def stop():
        os.system(f"{base_command} down")


    @app.command()
    def eliminate():
        confirmation = typer.confirm("Are you sure you want to eliminate everything?")
        if confirmation:
            try:
                os.system(f"{base_command} down -v")
                typer.echo("Everything has been eliminated successfully.")
            except Exception as e:
                typer.echo(f"Failed to eliminate everything. Error: {str(e)}")
        else:
            typer.echo("Operation cancelled.")


    @app.command()
    def rm_volume(
        name: str = typer.Option(
            None,
            help="volume name to remove",
            autocompletion=lambda: utils.extract_compose_volume_names(
                utils.extract_yaml_files_from_base_command(base_command),
                utils.extract_project_name_from_base_command(base_command)
            )
        )
    ):
        if name is None:
            typer.echo(f"Please specify a volume name to remove.")
            return
        # The rest
        confirmation = "Yes I am fully sure."
        result = typer.prompt(
            f"""Please write "{confirmation}" to perform the deletion of "{name}" volume"""
        )
        if result == confirmation:
            os.system(f"docker volume rm {name}")
        else:
            typer.echo("No command executed.")


    @app.command()
    def logs(
        name: str = typer.Option(
            None,
            help="service name to show logs of",
            autocompletion=lambda: utils.extract_compose_service_names(
                utils.extract_yaml_files_from_base_command(base_command)
            )
        )
    ):
        if name is None:
            os.system(f"{base_command} logs -f")
        else:
            os.system(f"{base_command} logs -f {name}")


    @app.command()
    def exec(
        name: str = typer.Option(
            None,
            help="service name to exec into",
            autocompletion=lambda: utils.extract_compose_service_names(
                utils.extract_yaml_files_from_base_command(base_command)
            )
        )
    ):
        if name is None:
            typer.echo(f"Please specify a service name to exec into.")
        else:
            os.system(f"{base_command} exec {name} bash -li")


    @app.command()
    def exec_root(
        name: str = typer.Option(
            None,
            help="service name to exec into",
            autocompletion=lambda: utils.extract_compose_service_names(
                utils.extract_yaml_files_from_base_command(base_command)
            )
        )
    ):
        if name is None:
            typer.echo(f"Please specify a service name to exec into.")
        else:
            os.system(f"{base_command} exec -u 0 {name} bash -li")


    @app.command()
    def get_ip(
        name: str = typer.Option(
            None,
            help="service name to get ip of",
            autocompletion=lambda: utils.extract_compose_service_names(
                utils.extract_yaml_files_from_base_command(base_command)
            )
        )
    ):
        srv = name if name is not None else ""
        inspect_format = """{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}} ||| {{.Name}} ||| {{index .Config.Labels "com.docker.compose.service"}} ||| {{range .NetworkSettings.Ports}}{{.}}{{end}}"""
        columnar_result = utils.check_output(f"{base_command} ps -q {srv} | xargs docker inspect --format '{inspect_format}' | column -t -s '|||' ;").strip()
        print(columnar_result)


    @app.command()
    def stats():
        os.system(f"watch -c -n 1 -- {base_command} ps -a ;")


    return app