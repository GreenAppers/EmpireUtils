package com.greenappers.empirelauncher;

import java.lang.reflect.Method;

public class EmpireLauncher {
    public static void main(String[] args) {
        try {
            System.out.println("EmpireLauncher starting");

            String targetClassName = System.getenv("EMPIRELAUNCHER_MAIN_CLASS");

            // Get the Class object for the class containing the main method
            Class<?> targetClass = Class.forName(targetClassName);

            // Find the main method
            Method mainMethod = targetClass.getMethod("main", String[].class);

            // Invoke the main method
            mainMethod.invoke(null, (Object) args);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
