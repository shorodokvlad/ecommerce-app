package com.shv.Ecommerce.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.cache.autoconfigure.RedisCacheManagerBuilderCustomizer;
import org.springframework.cache.Cache;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.serializer.GenericJacksonJsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import tools.jackson.databind.jsontype.BasicPolymorphicTypeValidator;

import java.time.Duration;

@Configuration
@Slf4j
public class CacheConfig implements CachingConfigurer {

    @Bean
    public RedisCacheConfiguration redisCacheConfiguration() {
        GenericJacksonJsonRedisSerializer serializer = GenericJacksonJsonRedisSerializer
                .builder()
                .enableSpringCacheNullValueSupport()
                .enableDefaultTyping(BasicPolymorphicTypeValidator.builder()
                        .allowIfBaseType(Object.class)
                        .build())
                .build();

        return RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(5))
                .disableCachingNullValues()
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(serializer));
    }

    @Bean
    public RedisCacheManagerBuilderCustomizer deliveryRefCacheCustomizer(RedisCacheConfiguration redisCacheConfiguration) {
        return builder -> builder.withCacheConfiguration("deliveryRef",
                redisCacheConfiguration.entryTtl(Duration.ofHours(1)));
    }

    @Bean
    public RedisCacheManagerBuilderCustomizer topProductsCacheCustomizer(RedisCacheConfiguration redisCacheConfiguration) {
        return builder -> builder.withCacheConfiguration("topProducts",
                redisCacheConfiguration.entryTtl(Duration.ofMinutes(10)));
    }

    @Override
    public CacheErrorHandler errorHandler() {
        return new CacheErrorHandler() {
            @Override
            public void handleCacheGetError(RuntimeException exception, Cache cache, Object key) {
                log.warn("Cache get failed for cache={}, key={}, falling back to data source: {}", cache.getName(), key, exception.getMessage());
            }

            @Override
            public void handleCachePutError(RuntimeException exception, Cache cache, Object key, Object value) {
                log.warn("Cache put failed for cache={}, key={}: {}", cache.getName(), key, exception.getMessage());
            }

            @Override
            public void handleCacheEvictError(RuntimeException exception, Cache cache, Object key) {
                log.warn("Cache evict failed for cache={}, key={}: {}", cache.getName(), key, exception.getMessage());
            }

            @Override
            public void handleCacheClearError(RuntimeException exception, Cache cache) {
                log.warn("Cache clear failed for cache={}: {}", cache.getName(), exception.getMessage());
            }
        };
    }
}