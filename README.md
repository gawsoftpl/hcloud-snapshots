# About
Simple create snapshot and restore server from snapshots in hetzner cloud

# Commands
Create snapshot
```sh
PROJECT_PREFIX=test node snapshot.js
```

Restore snapshot
```sh
PROJECT_PREFIX=test SSH_KEY_NAME=ssh-test node restore.js
```