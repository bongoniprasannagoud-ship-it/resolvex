
package com.college.complaint_system.controller;

import com.college.complaint_system.dto.ComplaintResponse;
import com.college.complaint_system.dto.CreateComplaintRequest;
import com.college.complaint_system.dto.UpdateComplaintStatusRequest;
import com.college.complaint_system.entity.Complaint;
import com.college.complaint_system.service.ComplaintService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.college.complaint_system.dto.ComplaintHistoryResponse;

import java.util.List;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    private final ComplaintService complaintService;

    public ComplaintController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    @PostMapping
    public ComplaintResponse createComplaint(
            @Valid @RequestBody CreateComplaintRequest request,
            Authentication authentication) {

        Complaint complaint = complaintService.createComplaint(
                request,
                authentication.getName()
        );

        return ComplaintResponse.from(complaint);
    }

    @GetMapping("/my")
    public List<ComplaintResponse> getMyComplaints(
            Authentication authentication) {

        return complaintService.getMyComplaints(
                        authentication.getName())
                .stream()
                .map(ComplaintResponse::from)
                .toList();
    }

    @GetMapping
    public List<ComplaintResponse> getAllComplaints() {

        return complaintService.getAllComplaints()
                .stream()
                .map(ComplaintResponse::from)
                .toList();
    }

    @GetMapping("/{id}")
    public ComplaintResponse getComplaint(
            @PathVariable Long id) {

        return ComplaintResponse.from(
                complaintService.getComplaint(id));
    }
    
    @GetMapping("/{complaintId}/history")
public List<ComplaintHistoryResponse> getComplaintHistory(
        @PathVariable Long complaintId,
        Authentication authentication) {

    String role = authentication.getAuthorities()
            .stream()
            .findFirst()
            .map(authority -> authority.getAuthority())
            .orElse("");

    return complaintService.getComplaintHistory(
            complaintId,
            authentication.getName(),
            role
    );
}


    @PatchMapping("/{complaintId}/status")
    public ComplaintResponse updateStatus(
            @PathVariable Long complaintId,
            @Valid @RequestBody
                    UpdateComplaintStatusRequest request,
            Authentication authentication) {

        Complaint complaint = complaintService.updateStatus(
                complaintId,
                request.getStatus(),
                authentication.getName()
        );

        return ComplaintResponse.from(complaint);
    }

    
@PostMapping("/{complaintId}/close")
public ComplaintResponse closeComplaint(
        @PathVariable Long complaintId) {

    Complaint complaint =
            complaintService.closeComplaint(complaintId);

    return ComplaintResponse.from(complaint);
}

@PostMapping("/{complaintId}/reopen")
public ComplaintResponse reopenComplaint(
        @PathVariable Long complaintId,
        Authentication authentication) {

    Complaint complaint =
            complaintService.reopenComplaint(
                    complaintId,
                    authentication.getName()
            );

    return ComplaintResponse.from(complaint);
}

@GetMapping("/assigned")
public List<ComplaintResponse> getAssignedComplaints(
        Authentication authentication) {

    return complaintService
            .getAssignedComplaints(authentication.getName())
            .stream()
            .map(ComplaintResponse::from)
            .toList();
}
}
