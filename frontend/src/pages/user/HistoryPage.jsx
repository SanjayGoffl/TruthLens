import AnalysisListTable from '../../components/analysis/AnalysisListTable';
export default function HistoryPage() {
  return (
    <AnalysisListTable
      title="Analysis history"
      subtitle="Every article you have analyzed, with search, filters, sorting and export"
      emptyTitle="No analyses yet"
      emptyText="When you analyze an article, the full credibility report will be stored here with its score, claims and evidence."
    />
  );
}
