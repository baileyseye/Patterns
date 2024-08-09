package baileyes.eyes.loggerstarter.config;

import baileyes.eyes.loggerstarter.logger.AspectLogger;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.context.annotation.Bean;

@AutoConfiguration
public class LoggerConfig {

    @Bean
    public AspectLogger logger() {
        return new AspectLogger();
    }
}
