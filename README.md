# Proxara

Proxara is an intelligent API gateway designed for autonomous AI agents. It acts as a middleware layer between application code and LLM providers (such as OpenAI and Anthropic) to enforce enterprise-grade reliability, observability, and cost controls.

## Overview

As organizations deploy autonomous AI agents, they face risks such as unbounded API costs due to recursive logic loops and high latency from redundant computations. Proxara solves this by intercepting LLM requests and applying intelligent routing and caching strategies before the request reaches the provider.

## Current Features

* **Stateful Circuit Breaking:** Redis-backed protection tracks failures per tenant and blocks unhealthy request flows.
* **Semantic Caching:** Pinecone-backed embedding cache returns semantically similar prompt responses before calling an LLM.
* **Multi-Provider Routing:** Groq-first routing with failover to OpenAI on retryable provider/server errors.
* **Tenant Gateway Auth:** Bearer key authentication backed by Redis-stored tenant metadata.
* **Health Endpoint:** `/health` reports combined Redis and PostgreSQL status.

## Project Status

This project is in active development, with a working gateway flow already in place on `main`.

Current state snapshot:

* Fastify gateway endpoint at `POST /v1/chat/completions` is active.
* Request pipeline includes auth, circuit breaker, semantic cache check, and provider routing.
* Groq (`llama-3.3-70b-versatile`) is configured as the primary provider.
* OpenAI is configured as fallback when failover conditions are met.
* Redis and PostgreSQL run locally through Docker Compose.

Areas still evolving:

* More robust observability and metrics.
* Dashboard and broader management surface.
* Expanded automated test coverage.
