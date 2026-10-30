
package com.college.complaint_system.controller;


import com.college.complaint_system.dto.AssignComplaintRequest;
import com.college.complaint_system.dto.ComplaintResponse;
import com.college.complaint_system.dto.ReviewComplaintRequest;
import com.college.complaint_system.entity.Complaint;
import com.college.complaint_system.service.ComplaintService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import com.college.complaint_system.dto.StaffOptionResponse;
import com.college.complaint_system.entity.UserRole;
import com.college.complaint_system.repository.UserRepository;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final ComplaintService complaintService;
    private final UserRepository userRepository;

    public AdminController(
        ComplaintService complaintService,
        UserRepository userRepository
) {
    this.complaintService = complaintService;
    this.userRepository = userRepository;
}
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

    @GetMapping("/staff")
public List<StaffOptionResponse> getStaff() {
    return userRepository.findByRole(UserRole.STAFF)
            .stream()
            .map(StaffOptionResponse::from)
            .toList();
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
