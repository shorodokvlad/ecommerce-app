package com.shv.Ecommerce;

import com.shv.Ecommerce.entity.User;
import com.shv.Ecommerce.repository.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ApplicationContext;

@SpringBootApplication
public class TestDb implements CommandLineRunner {
    @Autowired
    private UserRepo userRepo;

    public static void main(String[] args) {
        SpringApplication.run(TestDb.class, args);
    }

    @Override
    public void run(String... args) throws Exception {
        System.out.println("TESTING REPO");
        userRepo.findAll().forEach(u -> {
            System.out.println("User: " + u.getEmail() + " | Has Address: " + (u.getAddress() != null));
            if (u.getAddress() != null) {
                System.out.println("  -> City: " + u.getAddress().getCity());
            }
        });
        System.exit(0);
    }
}
