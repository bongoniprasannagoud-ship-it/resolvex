package com.college.complaint_system.dto;

public class LoginResponse {

    private String token;
    private String role;
    private Long userId;

    public LoginResponse(
            String token,
            String role,
            Long userId) {

        this.token = token;
        this.role = role;
        this.userId = userId;
    }

    public String getToken() {
        return token;
    }

    public String getRole() {
        return role;
    }

    public Long getUserId() {
        return userId;
    }
}