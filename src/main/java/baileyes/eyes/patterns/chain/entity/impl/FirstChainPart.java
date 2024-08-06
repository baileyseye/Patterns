package baileyes.eyes.patterns.chain.entity.impl;

import baileyes.eyes.patterns.chain.entity.ChainPart;
import baileyes.eyes.patterns.chain.entity.dto.ProcessDataDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Slf4j
@Order(1)
@Component
@RequiredArgsConstructor
public class FirstChainPart implements ChainPart {

    @Override
    public ProcessDataDto<?> process(ProcessDataDto<?> previousData) {
        return previousData;
    }
}
