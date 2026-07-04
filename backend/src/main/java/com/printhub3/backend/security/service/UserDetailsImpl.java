package com.printhub3.backend.security.service;

import com.printhub3.backend.entity.User;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.io.Serial;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 * Custom UserDetails Implementation
 * Implements Spring Security's UserDetails interface
 * Carries user information from the database
 */
@Getter
@Setter
@AllArgsConstructor
public class UserDetailsImpl implements UserDetails {

    @Serial
    private static final long serialVersionUID = 1L;

    private Long userId;
    private String username;
    private String email;
    private String password;
    private Collection<? extends GrantedAuthority> authorities;
    private Boolean isAccountNonExpired;
    private Boolean isAccountNonLocked;
    private Boolean isCredentialsNonExpired;
    private Boolean isEnabled;

    /**
     * Build UserDetailsImpl from User entity
     */
    public static UserDetailsImpl build(User user) {
        // Build authorities from user role
        List<GrantedAuthority> authorities = new ArrayList<>();
        
        if (user.getRole() != null) {
            // Add ROLE_ prefix as per Spring Security convention
            authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().getName()));
        }

        return new UserDetailsImpl(
                user.getUserId(),
                user.getEmail(),
                user.getEmail(),
                user.getPasswordHash(),
                authorities,
                true,
                true,
                true,
                user.getIsActive() != null && user.getIsActive()
        );
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return isAccountNonExpired != null && isAccountNonExpired;
    }

    @Override
    public boolean isAccountNonLocked() {
        return isAccountNonLocked != null && isAccountNonLocked;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return isCredentialsNonExpired != null && isCredentialsNonExpired;
    }

    @Override
    public boolean isEnabled() {
        return isEnabled != null && isEnabled;
    }
}
