package baileyes.eyes.kafkastarter.config.serializer.avro;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;
import org.apache.avro.io.DatumReader;
import org.apache.avro.io.DecoderFactory;
import org.apache.avro.specific.SpecificDatumReader;
import org.apache.avro.specific.SpecificRecordBase;
import org.apache.kafka.common.serialization.Deserializer;
import org.jetbrains.annotations.NotNull;

public class AvroDeserializer<T extends SpecificRecordBase> implements Deserializer<T> {

    private final Class<T> targetType;

    public AvroDeserializer(Class<T> targetType) {
        this.targetType = targetType;
    }

    @Override
    public T deserialize(String topic, byte[] data) {
        if (data == null) {
            return null;
        }

        try {
            T instance = createInstance();
            
            DatumReader<T> datumReader = new SpecificDatumReader<>(instance.getSchema());
            ByteArrayInputStream inputStream = new ByteArrayInputStream(data);
            
            return datumReader.read(null, DecoderFactory.get().binaryDecoder(inputStream, null));
        } catch (IOException | ReflectiveOperationException e) {
            throw new RuntimeException("Failed to deserialize Avro data", e);
        }
    }

    @NotNull
    private T createInstance()
        throws NoSuchMethodException, InstantiationException, IllegalAccessException, InvocationTargetException {
        Constructor<T> constructor = targetType.getConstructor();

        return constructor.newInstance();
    }
}
