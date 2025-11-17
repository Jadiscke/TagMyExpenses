# Supabase Port Conflict Troubleshooting

If you're getting a "Ports are not available" error when running `npx supabase start`, try these solutions:

## Solution 1: Stop All Supabase Containers

```bash
npx supabase stop
```

## Solution 2: Remove All Supabase Docker Resources

```bash
# Stop Supabase
npx supabase stop

# Remove all Supabase containers
docker ps -a --filter "name=supabase" -q | xargs docker rm -f

# Remove Supabase networks
docker network ls | grep supabase | awk '{print $1}' | xargs docker network rm

# Remove Supabase volumes (WARNING: This deletes your local data)
docker volume ls | grep supabase | awk '{print $2}' | xargs docker volume rm
```

## Solution 3: Restart Docker Desktop

1. Quit Docker Desktop completely
2. Restart Docker Desktop
3. Try `npx supabase start` again

## Solution 4: Check What's Using the Port

```bash
# On macOS/Linux
lsof -i :54324

# Or check all Supabase ports
lsof -i :54321  # API
lsof -i :54322  # DB
lsof -i :54323  # Studio
lsof -i :54324  # Storage
```

## Solution 5: Change Supabase Ports (Advanced)

If you need to use different ports, you can modify `supabase/config.toml`:

```toml
[api]
port = 54321

[db]
port = 54322

[studio]
port = 54323

[storage]
port = 54324  # Change this to an available port
```

Then restart Supabase.

## Solution 6: Complete Reset

If nothing else works:

```bash
# Stop everything
npx supabase stop

# Remove all Docker containers, networks, and volumes
docker system prune -a --volumes

# Restart Docker Desktop
# Then try again
npx supabase start
```

**Warning:** This will remove ALL Docker containers, not just Supabase ones.

## Common Causes

1. **Previous Supabase instance not properly stopped** - Most common
2. **Docker Desktop not running** - Make sure Docker is running
3. **Another application using the port** - Check with `lsof` or `netstat`
4. **Docker network conflicts** - Restart Docker Desktop

## Quick Fix

The quickest solution is usually:

```bash
npx supabase stop
# Wait a few seconds
npx supabase start
```

If that doesn't work, restart Docker Desktop and try again.

