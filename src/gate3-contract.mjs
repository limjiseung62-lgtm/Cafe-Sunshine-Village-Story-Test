// Read-only mapping. Live checkpoint is authoritative over base save.
export function gate3Observation(save){const live=save?.campaign?.run&&!save.campaign.run.closed?save.campaign.run:null;const s=(live?.cafe?.mega??save?.mega)?.finalGrowth?.specialization;return{specialization:['mass','brand'].includes(s?.path)?s.path:null,specializationStage:s?Math.min(4,Math.max(1,s.renewal?.stage??1)):0};}
