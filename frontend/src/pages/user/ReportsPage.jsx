import AnalysisListTable from '../../components/analysis/AnalysisListTable';
export default function ReportsPage() {
  return (
    <AnalysisListTable
      savedOnly
      title="Saved reports"
      subtitle="Analyses you bookmarked for later reference"
      emptyTitle="No saved reports"
      emptyText="Use the bookmark icon on any analysis (or the “Save report” button inside a report) to keep important analyses here."
    />
  );
}
