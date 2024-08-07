package baileyes.eyes.factory.abstractfactory.service.impl;

import baileyes.eyes.factory.abstractfactory.service.DogToy;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class DogChewToy implements DogToy {

    @Override
    public void use() {
        log.info("Using Dog Chew Toy");
    }
}
