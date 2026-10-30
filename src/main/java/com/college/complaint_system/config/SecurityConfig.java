package com.college.complaint_system.config;

import com.college.complaint_system.security.JwtAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http
                .csrf(csrf -> csrf.disable())

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        ))

                .exceptionHandling(exceptions -> exceptions
        .authenticationEntryPoint((request, response, ex) -> {
            System.err.println(
                    "AUTHENTICATION FAILURE: "
                            + request.getMethod() + " "
                            + request.getRequestURI()
                            + " | " + ex.getClass().getName()
                            + " | " + ex.getMessage()
            );

            response.sendError(
                    HttpServletResponse.SC_UNAUTHORIZED,
                    "Unauthorized"
            );
        })
        .accessDeniedHandler((request, response, ex) -> {
            System.err.println(
                    "ACCESS DENIED: "
                            + request.getMethod() + " "
                            + request.getRequestURI()
                            + " | " + ex.getClass().getName()
                            + " | " + ex.getMessage()
            );

            response.sendError(
                    HttpServletResponse.SC_FORBIDDEN,
                    "Forbidden"
            );
        })
)

                .authorizeHttpRequests(auth -> auth
                        
                        .requestMatchers(
                                org.springframework.http.HttpMethod.POST,
                                "/api/complaints/*/close"
                        ).hasRole("ADMIN")

                        .requestMatchers(
                                org.springframework.http.HttpMethod.POST,
                                "/api/complaints/*/reopen"
                        ).hasRole("STUDENT")

                        .requestMatchers("/api/auth/**")
                        .permitAll()
                        .requestMatchers("/error").permitAll()

                        .requestMatchers(
                                org.springframework.http.HttpMethod.PATCH,
                                "/api/complaints/*/status"
                        )
                        .hasRole("STAFF")

                        .requestMatchers(
                                org.springframework.http.HttpMethod.POST,
                                "/api/complaints"
                        )
                        .hasRole("STUDENT")

                        .requestMatchers(
                                org.springframework.http.HttpMethod.GET,
                                "/api/complaints/my"
                        )
                        .hasRole("STUDENT")

                        .requestMatchers(
                                "/api/complaints/assigned/**"
                        )
                        .hasAnyRole("STAFF", "ADMIN")

                        .requestMatchers(
                                "/api/admin/**"
                        )
                        .hasRole("ADMIN")

                        .anyRequest()
                        .authenticated()
                )

                .addFilterBefore(
                        jwtFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
    @Bean
        public FilterRegistrationBean<JwtAuthenticationFilter>
        jwtFilterRegistration(JwtAuthenticationFilter filter) {

        FilterRegistrationBean<JwtAuthenticationFilter> registration =
                new FilterRegistrationBean<>(filter);

        registration.setEnabled(false);

        return registration;
        }
}