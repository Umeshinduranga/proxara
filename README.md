# Proxara

Proxara is an intelligent API gateway designed for autonomous AI agents. It acts as a middleware layer between application code and LLM providers (such as OpenAI and Anthropic) to enforce enterprise-grade reliability, observability, and cost controls.

## Overview

As organizations deploy autonomous AI agents, they face risks such as unbounded API costs due to recursive logic loops and high latency from redundant computations. Proxara solves this by intercepting LLM requests and applying intelligent routing and caching strategies before the request reaches the provider.

## Features Currently Under Development

* **Stateful Circuit Breaking:** Redis-backed protection that monitors request frequency and error rates to automatically block runaway agent loops.
* **Semantic Caching:** Vector-based caching (via Pinecone) that serves conceptually identical prompts instantly, reducing API token costs and latency.
* **Dynamic Failover:** Automated routing between multiple LLM providers to ensure continuous uptime if a primary provider experiences an outage.

## Project Status

This project is currently under active development. 

The core monorepo architecture, Docker infrastructure (Redis and PostgreSQL), and basic pass-through proxy routing have been established. Advanced middleware layers for circuit breaking and semantic caching are actively being implemented.
