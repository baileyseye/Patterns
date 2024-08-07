package baileyes.eyes.factory.abstractfactory.service.impl;

import baileyes.eyes.factory.abstractfactory.service.CatToy;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class CatScratcher implements CatToy {

    @Override
    public void use() {
        log.info("Using Cat Scratcher");
    }
}
