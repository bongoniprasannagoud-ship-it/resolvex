
package com.college.complaint_system.service;

import com.college.complaint_system.dto.AnalyticsResponse;
import com.college.complaint_system.entity.*;
import com.college.complaint_system.repository.ComplaintRepository;
import com.college.complaint_system.repository.DepartmentRepository;
import com.college.complaint_system.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;

@Service
public class AnalyticsService {

    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;

    public AnalyticsService(
            ComplaintRepository complaintRepository,
            UserRepository userRepository,
            DepartmentRepository departmentRepository) {
        this.complaintRepository = complaintRepository;
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
    }

    @Transactional(readOnly = true)
    public AnalyticsResponse getAnalytics() {

        List<Complaint> complaints = complaintRepository.findAll();

        long total = complaints.size();

        long pending = countByStatuses(complaints,
                ComplaintStatus.OPEN,
                ComplaintStatus.PENDING_REVIEW,
                ComplaintStatus.ROUTED);

        long active = countByStatuses(complaints,
                ComplaintStatus.ASSIGNED,
                ComplaintStatus.IN_PROGRESS,
                ComplaintStatus.REOPENED);

        long resolved = countByStatuses(complaints,
                ComplaintStatus.RESOLVED);

        long closed = countByStatuses(complaints,
                ComplaintStatus.CLOSED);

        long rejected = countByStatuses(complaints,
                ComplaintStatus.REJECTED);

        AnalyticsResponse.Overview overview =
                new AnalyticsResponse.Overview(
                        total, pending, active, resolved, closed, rejected);

        List<AnalyticsResponse.StatusCount> statusBreakdown =
                Arrays.stream(ComplaintStatus.values())
                        .map(status -> new AnalyticsResponse.StatusCount(
                                status.name(),
                                complaints.stream()
                                        .filter(c -> c.getStatus() == status)
                                        .count()))
                        .toList();

        List<AnalyticsResponse.DepartmentStats> departmentStats =
                departmentRepository.findAll().stream()
                        .map(department -> {
                            List<Complaint> departmentComplaints =
                                    complaints.stream()
                                            .filter(c -> c.getDepartment() != null
                                                    && c.getDepartment().getId()
                                                    .equals(department.getId()))
                                            .toList();

                            return new AnalyticsResponse.DepartmentStats(
                                    department.getName(),
                                    departmentComplaints.size(),
                                    departmentComplaints.stream()
                                            .filter(c -> c.getAssignedTo() == null)
                                            .count(),
                                    countByStatuses(departmentComplaints,
                                            ComplaintStatus.ASSIGNED,
                                            ComplaintStatus.IN_PROGRESS,
                                            ComplaintStatus.REOPENED),
                                    countByStatuses(departmentComplaints,
                                            ComplaintStatus.RESOLVED),
                                    countByStatuses(departmentComplaints,
                                            ComplaintStatus.CLOSED)
                            );
                        })
                        .toList();

        List<AnalyticsResponse.StaffStats> staffStats =
                userRepository.findByRole(UserRole.STAFF).stream()
                        .map(staff -> {
                            List<Complaint> assignedComplaints =
                                    complaints.stream()
                                            .filter(c -> c.getAssignedTo() != null
                                                    && c.getAssignedTo().getId()
                                                    .equals(staff.getId()))
                                            .toList();

                            return new AnalyticsResponse.StaffStats(
                                    staff.getId(),
                                    staff.getName(),
                                    staff.getDepartment() != null
                                            ? staff.getDepartment().getName()
                                            : "Unassigned",
                                    assignedComplaints.size(),
                                    countByStatuses(assignedComplaints,
                                            ComplaintStatus.ASSIGNED,
                                            ComplaintStatus.IN_PROGRESS,
                                            ComplaintStatus.REOPENED),
                                    countByStatuses(assignedComplaints,
                                            ComplaintStatus.RESOLVED,
                                            ComplaintStatus.CLOSED)
                            );
                        })
                        .toList();

        YearMonth currentMonth = YearMonth.now();

        List<AnalyticsResponse.MonthlyStats> monthlyStats =
                java.util.stream.IntStream.rangeClosed(0, 5)
                        .mapToObj(i -> currentMonth.minusMonths(5 - i))
                        .map(month -> {
                            LocalDateTime start = month.atDay(1).atStartOfDay();
                            LocalDateTime end = month.plusMonths(1)
                                    .atDay(1).atStartOfDay();

                            long count = complaints.stream()
                                    .filter(c -> c.getCreatedAt() != null
                                            && !c.getCreatedAt().isBefore(start)
                                            && c.getCreatedAt().isBefore(end))
                                    .count();

                            return new AnalyticsResponse.MonthlyStats(
                                    month.format(DateTimeFormatter.ofPattern("MMM yyyy")),
                                    count
                            );
                        })
                        .toList();

        return new AnalyticsResponse(
                overview,
                statusBreakdown,
                departmentStats,
                staffStats,
                monthlyStats
        );
    }

    private long countByStatuses(
            List<Complaint> complaints,
            ComplaintStatus... statuses) {

        List<ComplaintStatus> selectedStatuses = List.of(statuses);

        return complaints.stream()
                .filter(c -> selectedStatuses.contains(c.getStatus()))
                .count();
    }
}
