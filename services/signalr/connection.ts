import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { environment } from "@/lib/environment";

export function createTournamentHubConnection(): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(environment.signalRHubUrl)
    .withAutomaticReconnect([0, 1000, 2000, 5000, 10000, 30000])
    .configureLogging(
      environment.isDevelopment ? LogLevel.Information : LogLevel.Warning,
    )
    .build();
}

export function mapHubState(state: HubConnectionState): string {
  switch (state) {
    case HubConnectionState.Connected:
      return "connected";
    case HubConnectionState.Connecting:
      return "connecting";
    case HubConnectionState.Reconnecting:
      return "reconnecting";
    case HubConnectionState.Disconnecting:
      return "disconnected";
    default:
      return "disconnected";
  }
}
