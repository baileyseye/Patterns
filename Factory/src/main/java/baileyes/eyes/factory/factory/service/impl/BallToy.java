package baileyes.eyes.factory.factory.service.impl;

import baileyes.eyes.factory.factory.service.PetToy;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class BallToy implements PetToy {

    @Override
    public void use() {
        log.info("Playing with BallToy");
    }
}
