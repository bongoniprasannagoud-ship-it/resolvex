
package com.college.complaint_system.dto;

import java.util.List;

public record AnalyticsResponse(
        Overview overview,
        List<StatusCount> statusBreakdown,
        List<DepartmentStats> departmentStats,
        List<StaffStats> staffStats,
        List<MonthlyStats> monthlyStats
) {
    public record Overview(
            long total,
            long pending,
            long active,
            long resolved,
            long closed,
            long rejected
    ) {}

    public record StatusCount(
            String status,
            long count
    ) {}

    public record DepartmentStats(
            String departmentName,
            long total,
            long unassigned,
            long active,
            long resolved,
            long closed
    ) {}

    public record StaffStats(
            Long staffId,
            String staffName,
            String departmentName,
            long assigned,
            long active,
            long resolved
    ) {}

    public record MonthlyStats(
            String month,
            long complaints
    ) {}
}
