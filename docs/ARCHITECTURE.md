# STARDEV CLI Architecture

STARDEV CLI is organized as command modules over reusable services. Commands own terminal input and orchestration, while services own GitHub, Git, deployment, README generation, AI provider calls, review analysis, screenshots, changelog creation, and encrypted configuration.

## Layers

- `commands`: Commander command registration and workflow orchestration.
- `github`, `deployment`, `ai`, `screenshots`, `review`, `releases`, `readme`, `portfolio`: domain services.
- `config`: encrypted local settings and token storage.
- `utils`, `logger`, `errors`: shared platform utilities.
- `types`, `constants`: typed contracts and application constants.

The code avoids committing secrets, validates inputs with Zod, keeps provider integrations behind interfaces, and reports failures through a consistent `StardevError` hierarchy.
