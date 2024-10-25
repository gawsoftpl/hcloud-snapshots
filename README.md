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