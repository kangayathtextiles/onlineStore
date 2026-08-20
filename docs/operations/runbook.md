# Operational Runbook — Local & Production

## 1. Local Environment Management

### Starting the Stack
```bash
docker-compose up -d
```

### Stopping the Stack
```bash
docker-compose down
```

### Resetting the Database
```bash
docker-compose down -v
docker-compose up -d postgres
```

### Viewing Logs
```bash
# All logs
docker-compose logs -f

# Backend API logs only
docker-compose logs -f api

# Frontend Web logs only
docker-compose logs -f web
```

---

## 2. Health Monitoring Probes

- **Liveness Probe**: `GET /health`  
  Returns `{ "status": "healthy", "app": "Kangayath Web API", "version": "0.1.0" }`. Used by load balancers.
- **Readiness / Diagnostic Probe**: `GET /api/v1/health`  
  Returns comprehensive subsystem status, environment metadata, and timestamps.
