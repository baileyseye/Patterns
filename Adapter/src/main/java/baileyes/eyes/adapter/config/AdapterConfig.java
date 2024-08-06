package baileyes.eyes.adapter.config;

import baileyes.eyes.adapter.adapter.Adaptee;
import baileyes.eyes.adapter.adapter.Target;
import baileyes.eyes.adapter.adapter.impl.Adapter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AdapterConfig {

    @Bean
    public Target target() {
        return new Adapter(new Adaptee());
    }
}
