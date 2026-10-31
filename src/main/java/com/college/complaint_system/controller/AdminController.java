package com.college.complaint_system.controller;

import com.college.complaint_system.dto.AnalyticsResponse;
import com.college.complaint_system.service.AnalyticsService;
import com.college.complaint_system.dto.AnalyticsResponse;
import com.college.complaint_system.dto.AssignComplaintRequest;
import com.college.complaint_system.dto.ComplaintResponse;
import com.college.complaint_system.dto.CreateStaffRequest;
import com.college.complaint_system.dto.DepartmentOptionResponse;
import com.college.complaint_system.dto.ReviewComplaintRequest;
import com.college.complaint_system.dto.StaffOptionResponse;
import com.college.complaint_system.dto.UpdateStaffRequest;
import com.college.complaint_system.entity.Complaint;
import com.college.complaint_system.service.AdminManagementService;
import com.college.complaint_system.service.ComplaintService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final ComplaintService complaintService;
    private final AdminManagementService adminManagementService;
    private final AnalyticsService analyticsService;

    public AdminController(
            ComplaintService complaintService,
            AdminManagementService adminManagementService,
            AnalyticsService analyticsService) {

        this.complaintService = complaintService;
        this.adminManagementService = adminManagementService;
        this.analyticsService = analyticsService;
    }

    // ---------------- STAFF MANAGEMENT ----------------

    @GetMapping("/staff")
    public List<StaffOptionResponse> getStaff() {
        return adminManagementService.getAllStaff();
    }

    @PostMapping("/staff")
    public StaffOptionResponse createStaff(
            @Valid @RequestBody CreateStaffRequest request) {

        return adminManagementService.createStaff(request);
    }

    @PutMapping("/staff/{staffId}")
    public StaffOptionResponse updateStaff(
            @PathVariable Long staffId,
            @Valid @RequestBody UpdateStaffRequest request) {

        return adminManagementService.updateStaff(staffId, request);
    }

    // ---------------- DEPARTMENT MANAGEMENT ----------------

    @GetMapping("/departments")
    public List<DepartmentOptionResponse> getDepartments() {
        return adminManagementService.getAllDepartments();
    }

    // ---------------- COMPLAINT MANAGEMENT ----------------

    @PutMapping("/complaints/{complaintId}/assign")
    public ComplaintResponse assignComplaint(
            @PathVariable Long complaintId,
            @Valid @RequestBody AssignComplaintRequest request) {

        Complaint complaint = complaintService.assignComplaint(
                complaintId,
                request.getStaffId()
        );

        return ComplaintResponse.from(complaint);
    }

    @GetMapping("/complaints/review-queue")
    public List<ComplaintResponse> getReviewQueue() {

        return complaintService.getManualReviewComplaints()
                .stream()
                .map(ComplaintResponse::from)
                .toList();
    }

    @GetMapping("/complaints/unassigned-queue")
    public List<ComplaintResponse> getUnassignedQueue() {

        return complaintService.getUnassignedComplaints()
                .stream()
                .map(ComplaintResponse::from)
                .toList();
    }

    @GetMapping("/analytics")
    public AnalyticsResponse getAnalytics() {
        return analyticsService.getAnalytics();
    }

    @PatchMapping("/complaints/{complaintId}/review")
    public ComplaintResponse reviewComplaint(
            @PathVariable Long complaintId,
            @Valid @RequestBody ReviewComplaintRequest request) {

        Complaint complaint = complaintService.reviewComplaint(
                complaintId,
                request.category(),
                request.priority(),
                request.reason()
        );

        return ComplaintResponse.from(complaint);
    }
}