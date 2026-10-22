import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { logDevError } from '@/helpers/log';
import { syncPendingReports } from '@/services/report-sending';

export const BACKGROUND_SYNC_TASK = 'sync-pending-reports';

/**
 * Vacía la cola de reportes pendientes desde el trabajo en segundo plano.
 */
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    await syncPendingReports();
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    logDevError('No se pudo sincronizar los reportes pendientes en segundo plano.', error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

/**
 * Registra la sincronización periódica en segundo plano cuando el sistema la permite.
 * un registro fallido solo se registra en el log de desarrollo.
 */
export async function registerBackgroundSyncAsync(): Promise<void> {
  try {
    if (!(await TaskManager.isAvailableAsync())) {
      return;
    }

    const status = await BackgroundTask.getStatusAsync();

    if (status !== BackgroundTask.BackgroundTaskStatus.Available) {
      return;
    }

    await BackgroundTask.registerTaskAsync(BACKGROUND_SYNC_TASK);
  } catch (error) {
    logDevError('No se pudo registrar la sincronización en segundo plano.', error);
  }
}
