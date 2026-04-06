export const EMBEDDING_PROJECT_SYNC_EVENT = 'embeddings.project.sync';

export interface EmbeddingProjectSyncEvent {
  projectId: string;
  reason: string;
}
