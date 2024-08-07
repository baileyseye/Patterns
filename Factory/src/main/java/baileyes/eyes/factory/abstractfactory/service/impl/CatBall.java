package baileyes.eyes.factory.abstractfactory.service.impl;

import baileyes.eyes.factory.abstractfactory.service.CatToy;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class CatBall implements CatToy {

    @Override
    public void use() {
        log.info("Playing with Cat Ball");
    }
}
