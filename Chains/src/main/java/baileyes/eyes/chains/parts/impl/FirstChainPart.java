package baileyes.eyes.chains.parts.impl;

import baileyes.eyes.chains.parts.ChainPart;
import baileyes.eyes.chains.parts.dto.ProcessDataDto;
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
