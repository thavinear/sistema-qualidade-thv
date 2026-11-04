FROM gradle:8.7-jdk17 AS build

WORKDIR /app

COPY . .

RUN chmod +x gradlew
RUN ./gradlew bootJar -x test

FROM eclipse-temurin:17-jre

WORKDIR /app

COPY --from=build /app/build/libs/*.jar app.jar

EXPOSE 10000

CMD ["java", "-Dserver.port=10000", "-jar", "app.jar"]