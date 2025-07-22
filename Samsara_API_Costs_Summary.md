# Samsara API & Webhook Costs for FleetChat Integration
*Summary Document - July 22, 2025*

## Executive Summary

**No Additional Costs:** FleetChat clients will NOT incur additional charges from Samsara for API and webhook usage. All integration capabilities are included in existing Samsara fleet management subscriptions.

## Cost Analysis

### Samsara Charges: $0
- **API Calls**: Included in subscription (no per-call fees)
- **Webhook Notifications**: Included in subscription (no per-event fees)
- **Integration Features**: Standard platform capabilities at no extra cost

### Rate Limits (Not Billing)
- 150 requests/second per API token
- 200 requests/second per organization
- Performance controls, not cost barriers

## FleetChat Integration APIs Used

### Driver Management APIs (Free)
- `GET /fleet/drivers` - Driver list retrieval
- `GET /fleet/drivers/{id}` - Individual driver details  
- `PATCH /fleet/drivers/{id}` - Phone number mapping updates

### Vehicle & Route APIs (Free)
- `GET /fleet/vehicles` - Vehicle inventory and status
- `GET /fleet/routes` - Active route assignments
- `GET /fleet/routes/{id}` - Route details and waypoints

### Document APIs (Free)
- `POST /fleet/documents` - Document uploads from WhatsApp
- `GET /fleet/documents/{id}` - Document metadata retrieval

## Webhook Events Used (All Free)

### Real-Time Events
- **Vehicle Location Updates** - GPS position changes
- **Route Status Changes** - Trip start/completion, waypoint arrivals
- **HOS Events** - Duty status transitions, violations, break reminders
- **Safety Alerts** - Hard braking, speeding, collision detection
- **Maintenance Events** - Fault codes, inspection alerts, service reminders
- **Geofence Events** - Entry/exit notifications for pickup/delivery locations

### Automatic Configuration
- Webhooks automatically created during FleetChat setup
- Per-customer webhook endpoints with security verification
- No manual Samsara configuration required from clients

## Integration Setup Process

### Client Requirements
1. **Existing Samsara subscription** (already paying for platform)
2. **API credentials** (standard Samsara feature)
3. **No additional Samsara fees** for FleetChat integration

### Automatic Configuration
- FleetChat creates webhooks automatically using client's API credentials
- All necessary event subscriptions configured without client intervention
- Security and authentication handled seamlessly

## Cost Comparison

| Service | Samsara Charges | FleetChat Charges |
|---------|----------------|-------------------|
| **API Access** | $0 (included) | $0 |
| **Webhook Events** | $0 (included) | $0 |
| **Integration Setup** | $0 (automated) | $0 |
| **Communication Service** | $0 | $15-35/driver/month |

## Business Impact

### For FleetChat Clients
- **Zero additional Samsara costs** for integration
- **Leverage existing investment** in Samsara platform
- **Only new cost**: FleetChat communication service fees
- **No impact on Samsara licensing** or subscription pricing

### Integration Value
- Full bidirectional communication capability
- Real-time event processing
- Automatic driver phone number mapping
- WhatsApp Business messaging layer
- All built on existing Samsara infrastructure at no extra cost

## Key Takeaways

1. **Samsara APIs and webhooks are included features** - no usage fees
2. **FleetChat integration leverages existing subscriptions** - no additional licensing required
3. **Only cost is FleetChat service** - communication middleware pricing only
4. **Automatic setup process** - no manual Samsara configuration needed
5. **Rate limits exist for performance** - not billing thresholds

## Conclusion

FleetChat provides communication middleware that enhances existing Samsara investments without increasing Samsara costs. Clients pay only for FleetChat's WhatsApp communication service while leveraging their current Samsara platform capabilities through included API and webhook features.

This cost structure makes FleetChat integration highly attractive for existing Samsara customers, as it adds significant communication value without requiring additional fleet management platform expenses.