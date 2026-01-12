# Keep Alive Service for Kosmix Spaces

## Overview

The Keep Alive Service is designed to maintain server activity and prevent hibernation in cloud deployments. It performs regular health checks and self-pings to ensure the application remains responsive and database connections stay active.

## Features

- **Automatic Self-Pinging**: Sends periodic HTTP requests to the health endpoint to prevent server hibernation
- **Database Health Monitoring**: Regularly checks database connectivity and collection status
- **Configurable Intervals**: Customizable ping and health check intervals via environment variables
- **Statistics Tracking**: Comprehensive statistics on service performance and uptime
- **Manual Operations**: API endpoints for manual pings and service control
- **Error Handling**: Robust error handling with automatic retry mechanisms

## Configuration

Add these environment variables to your `.env` file:

```env
# Keep Alive Service Configuration
KEEP_ALIVE_ENABLED=true
KEEP_ALIVE_PING_INTERVAL=840          # 14 minutes (in seconds)
KEEP_ALIVE_HEALTH_CHECK_INTERVAL=60   # 1 minute (in seconds)
```

## API Endpoints

### Get Service Statistics
```
GET /api/keep-alive/stats
```

Returns comprehensive statistics about the keep-alive service including:
- Service running status
- Uptime information
- Total pings and health checks performed
- Last ping and health check timestamps
- Configuration intervals

### Manual Ping
```
POST /api/keep-alive/ping
```

Performs a manual ping and health check, returning:
- Success status
- Execution timestamp
- Current service statistics
- Error details (if any)

### Start Service
```
POST /api/keep-alive/start
```

Manually starts the keep-alive service (if not already running).

### Stop Service
```
POST /api/keep-alive/stop
```

Manually stops the keep-alive service.

## Service Architecture

### KeepAliveService Class

The main service class that handles:
- Background ping loops
- Health check loops
- Database connectivity monitoring
- Statistics collection
- Error handling and recovery

### Background Tasks

1. **Ping Loop**: Sends HTTP requests to `/api/health` at configured intervals
2. **Health Check Loop**: Monitors database connectivity and collection status

### Database Health Checks

The service monitors:
- Database connectivity (ping command)
- Collection document counts for key collections:
  - `premium_listings`
  - `partners`
  - `leads`

## Integration

The service is automatically integrated into the FastAPI application lifecycle:

1. **Startup**: Service starts automatically when the application starts (if enabled)
2. **Runtime**: Runs continuously in the background
3. **Shutdown**: Service stops gracefully when the application shuts down

## Dependencies

- `aiohttp`: For HTTP client functionality
- `motor`: For async MongoDB operations
- `asyncio`: For background task management

## Testing

Run the test script to verify service functionality:

```bash
cd backend
python test_keep_alive.py
```

## Use Cases

### Cloud Deployments
- Prevents server hibernation on platforms like Heroku, Railway, or Render
- Maintains active connections to prevent cold starts
- Ensures consistent application availability

### Development
- Monitors application health during development
- Provides insights into database connectivity
- Helps identify performance issues

### Production Monitoring
- Continuous health monitoring
- Uptime tracking
- Performance statistics collection

## Error Handling

The service includes robust error handling:
- Automatic retry on failed pings (30-second delay)
- Comprehensive error logging
- Graceful degradation on database issues
- Statistics tracking of errors

## Performance Impact

The service is designed to be lightweight:
- Minimal CPU usage
- Low memory footprint
- Configurable intervals to balance activity vs. resource usage
- Efficient database operations (estimated document counts)

## Monitoring

Monitor the service through:
- API endpoints for real-time statistics
- Application logs for detailed operation info
- Database performance metrics
- Uptime tracking

## Best Practices

1. **Interval Configuration**: Balance between keeping active and resource usage
2. **Error Monitoring**: Monitor logs for persistent errors
3. **Statistics Review**: Regularly check service statistics
4. **Resource Monitoring**: Monitor server resources to ensure service doesn't impact performance

## Troubleshooting

### Service Not Starting
- Check `KEEP_ALIVE_ENABLED` environment variable
- Verify database connectivity
- Check application logs for startup errors

### High Resource Usage
- Increase ping intervals
- Reduce health check frequency
- Monitor database query performance

### Failed Pings
- Verify server configuration
- Check network connectivity
- Review firewall settings
- Ensure health endpoint is accessible