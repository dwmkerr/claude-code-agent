# Issues

## Persistence

- [ ] basic setup for local/docker/helm

**Helm Values** (`values.yaml`):

```yaml
workspace:
  persistence:
    enabled: false      # default: emptyDir (ephemeral)
    existingClaim: ""   # use existing PVC (takes precedence)
    size: 5Gi           # size for new PVC
    storageClass: ""    # storage class (empty = cluster default)
```

**Usage**:

```bash
# Default - emptyDir (ephemeral, lost on pod restart)
helm install claude-code-agent ...

# Create a new PVC for persistence
helm install claude-code-agent ... --set workspace.persistence.enabled=true

# Use existing PVC
helm install claude-code-agent ... --set workspace.persistence.existingClaim=my-workspace
```
