import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  FileText,
  Download,
  Filter,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { ReportTable } from '../components/analytics';

const ExecutiveReports = () => {
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('PROJECT_SUMMARY');
  const [reportData, setReportData] = useState([]);
  const [alertMsg, setAlertMsg] = useState('');

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/analytics/reports?reportType=${reportType}`);
      setReportData(res.data.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch report data:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  const handleCSVExport = () => {
    if (!reportData || reportData.length === 0) return;
    const headers = Object.keys(reportData[0]).join(',');
    const rows = reportData.map(row =>
      Object.values(row).map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportType}_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setAlertMsg(`Exported ${reportData.length} records to CSV successfully.`);
  };

  const getColumns = () => {
    if (reportType === 'PROJECT_SUMMARY') {
      return [
        { header: 'Project Code', accessorKey: 'projectCode' },
        { header: 'Name', accessorKey: 'name' },
        { header: 'Status', accessorKey: 'status' },
        { header: 'Health', accessorKey: 'health' },
        { header: 'Progress %', accessorKey: 'progress' }
      ];
    } else if (reportType === 'TIME_TRACKING') {
      return [
        { header: 'User', accessorKey: 'user' },
        { header: 'Project', accessorKey: 'project' },
        { header: 'Task', accessorKey: 'task' },
        { header: 'Hours Worked', accessorKey: 'hoursWorked' },
        { header: 'Work Date', accessorKey: 'workDate' }
      ];
    }
    return [
      { header: 'Task Title', accessorKey: 'title' },
      { header: 'Assignee', accessorKey: 'assignee' },
      { header: 'Project', accessorKey: 'project' },
      { header: 'Status', accessorKey: 'status' },
      { header: 'Estimated Hours', accessorKey: 'estimatedHours' },
      { header: 'Actual Hours', accessorKey: 'actualHours' }
    ];
  };

  return (
    <div className="flex-1 flex flex-col space-y-6 text-left">
      {/* Alert Banner */}
      {alertMsg && (
        <div className="bg-primary/10 border border-primary/30 text-primary px-4 py-3 rounded-2xl flex items-center justify-between animate-in fade-in duration-300">
          <span className="text-xs font-bold">{alertMsg}</span>
          <button onClick={() => setAlertMsg('')} className="text-primary hover:opacity-70">
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-primary" /> Executive Reports & Export Center
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            Generate enterprise performance reports, inspect project metrics, and export data in CSV/PDF formats.
          </p>
        </div>

        <button
          onClick={handleCSVExport}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md hover:bg-primary-hover transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" /> Download Export CSV
        </button>
      </div>

      {/* Report Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-border/40 pb-4 overflow-x-auto">
        {[
          { type: 'PROJECT_SUMMARY', label: 'Project Summary Report' },
          { type: 'TIME_TRACKING', label: 'Work Hours & Time Tracking' },
          { type: 'TASK_PERFORMANCE', label: 'Task Execution & Status' }
        ].map(r => (
          <button
            key={r.type}
            onClick={() => setReportType(r.type)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              reportType === r.type
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Report Data Table */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground text-sm font-bold animate-pulse">
          Generating executive report data...
        </div>
      ) : (
        <ReportTable
          title={`${reportType.replace('_', ' ')} REPORT`}
          data={reportData}
          columns={getColumns()}
          onExport={handleCSVExport}
        />
      )}
    </div>
  );
};

export default ExecutiveReports;
