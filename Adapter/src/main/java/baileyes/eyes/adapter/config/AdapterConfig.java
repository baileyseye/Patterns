package baileyes.eyes.adapter.config;

import baileyes.eyes.adapter.adapter.OldCatToy;
import baileyes.eyes.adapter.adapter.NewCatToy;
import baileyes.eyes.adapter.adapter.impl.ToyAdapter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AdapterConfig {

    @Bean
    public NewCatToy newCatToy() {
        return new ToyAdapter(new OldCatToy());
    }
}
