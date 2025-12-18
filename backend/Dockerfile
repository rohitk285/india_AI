FROM openjdk:21-jdk-slim

# setting the working directory
WORKDIR /app

# copying the built jar file into the container
COPY target/*.jar app.jar

# expose the app port
EXPOSE 8080

#running jar file
ENTRYPOINT ["java", "-jar", "app.jar"]