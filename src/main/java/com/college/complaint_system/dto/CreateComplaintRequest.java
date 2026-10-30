package com.college.complaint_system.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import com.college.complaint_system.entity.ComplaintCategory;

public class CreateComplaintRequest {

    @NotBlank
    @Size(max = 200)
    private String title;

    @NotBlank
    @Size(min = 10, max = 2000)
    private String description;

    private Long userId;

    private ComplaintCategory category;

    public ComplaintCategory getCategory() {
        return category;
    }

    public void setCategory(ComplaintCategory category) {
        this.category = category;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}