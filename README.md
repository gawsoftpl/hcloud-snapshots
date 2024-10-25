# About
Simple create snapshot and restore server from snapshots in hetzner cloud

# Commands
Create snapshot with project prefix (will create snapshot for all instances start with eq: test-project-*)
```
PROJECT_PREFIX=test-project
#test-project-master-0
#test-project-master-1 
#etc...
```

```sh
PROJECT_PREFIX=test-project node snapshot.js
```

Restore snapshot
```sh
PROJECT_PREFIX=test-project SSH_KEY_NAME=ssh-test node restore.js
```

# ENV

## Required
```sh
PROJECT_PREFIX="" #projectprefix name
HCLOUD_TOKEN="xxx" # Token to hcloud 
SSH_KEY_NAME="test" # SSH Key name
```

## Optional
```sh
USER_DATA="#cloud-config\nruncmd:\n- [touch, /root/cloud-init-worked]\n"
NO_DELETE_SERVER=1 # Do not delete server after create dump
NETWORKS_FORCE="network-1-network-2" # Network force assigned to instances joined by "-"
```
