package main.config;

import java.time.Duration;
import org.ehcache.config.builders.*;
import org.ehcache.jsr107.Eh107Configuration;
import org.hibernate.cache.jcache.ConfigSettings;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.cache.JCacheManagerCustomizer;
import org.springframework.boot.autoconfigure.orm.jpa.HibernatePropertiesCustomizer;
import org.springframework.boot.info.BuildProperties;
import org.springframework.boot.info.GitProperties;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.interceptor.KeyGenerator;
import org.springframework.context.annotation.*;
import tech.jhipster.config.JHipsterProperties;
import tech.jhipster.config.cache.PrefixedKeyGenerator;

@Configuration
@EnableCaching
public class CacheConfiguration {

    private GitProperties gitProperties;
    private BuildProperties buildProperties;
    private final javax.cache.configuration.Configuration<Object, Object> jcacheConfiguration;
    // OPT-05: configurazioni per-tipo — inizializzate nel costruttore.
    private javax.cache.configuration.Configuration<Object, Object> coldCacheConfiguration;
    private javax.cache.configuration.Configuration<Object, Object> hotCacheConfiguration;

    public CacheConfiguration(JHipsterProperties jHipsterProperties) {
        JHipsterProperties.Cache.Ehcache ehcache = jHipsterProperties.getCache().getEhcache();

        // OPT-05: configurazione di default (usata per tutte le cache non specializzate).
        jcacheConfiguration = Eh107Configuration.fromEhcacheCacheConfiguration(
            CacheConfigurationBuilder.newCacheConfigurationBuilder(
                Object.class,
                Object.class,
                ResourcePoolsBuilder.heap(ehcache.getMaxEntries())
            )
                .withExpiry(ExpiryPolicyBuilder.timeToLiveExpiration(Duration.ofSeconds(ehcache.getTimeToLiveSeconds())))
                .build()
        );

        // OPT-05: cache "fredda" per dati quasi-immutabili (Allergene, Authority).
        // TTL 24 ore: gli allergeni cambiano rarissimamente (aggiunta/rimozione manuale).
        // Tenere in cache tutto il giorno evita query ripetute su ogni richiesta pubblica.
        coldCacheConfiguration = Eh107Configuration.fromEhcacheCacheConfiguration(
            CacheConfigurationBuilder.newCacheConfigurationBuilder(
                Object.class,
                Object.class,
                ResourcePoolsBuilder.heap(200) // dataset piccolo — 200 entry sono più che sufficienti
            )
                .withExpiry(ExpiryPolicyBuilder.timeToLiveExpiration(Duration.ofHours(24)))
                .build()
        );

        // OPT-05: cache "calda" per dati che cambiano frequentemente (PiattoDelGiorno).
        // TTL 5 minuti: i piatti del giorno vengono aggiornati dal gestore durante il servizio.
        // Un TTL troppo lungo (1 ora default) mostrerebbe piatti esauriti o non più disponibili.
        hotCacheConfiguration = Eh107Configuration.fromEhcacheCacheConfiguration(
            CacheConfigurationBuilder.newCacheConfigurationBuilder(Object.class, Object.class, ResourcePoolsBuilder.heap(500))
                .withExpiry(ExpiryPolicyBuilder.timeToLiveExpiration(Duration.ofMinutes(5)))
                .build()
        );
    }

    @Bean
    @SuppressWarnings("SpringJavaInjectionPointsAutowiringInspection") // bean registrato da Spring Boot Autoconfiguration a runtime, non visibile staticamente all'IDE
    public HibernatePropertiesCustomizer hibernatePropertiesCustomizer(javax.cache.CacheManager cacheManager) {
        return hibernateProperties -> hibernateProperties.put(ConfigSettings.CACHE_MANAGER, cacheManager);
    }

    @Bean
    public JCacheManagerCustomizer cacheManagerCustomizer() {
        return cm -> {
            // ── Cache utente (default TTL — sessioni medie) ───────────────────
            createCache(cm, main.repository.UserRepository.USERS_BY_LOGIN_CACHE);
            createCache(cm, main.repository.UserRepository.USERS_BY_EMAIL_CACHE);
            createCache(cm, main.domain.User.class.getName());
            createCache(cm, main.domain.User.class.getName() + ".authorities");
            createCache(cm, main.domain.PersistentToken.class.getName());
            createCache(cm, main.domain.User.class.getName() + ".persistentTokens");

            // ── Cache FREDDA: dati quasi-immutabili — TTL 24 ore ─────────────
            // Allergene: lista fissa, cambia solo con intervento manuale admin.
            createCacheWithConfig(cm, main.domain.Allergene.class.getName(), coldCacheConfiguration);
            createCacheWithConfig(cm, main.domain.Allergene.class.getName() + ".prodottos", coldCacheConfiguration);
            // Authority: ruoli sistema, non cambiano mai a runtime.
            createCacheWithConfig(cm, main.domain.Authority.class.getName(), coldCacheConfiguration);

            // ── Cache CALDA: dati ad alta mutabilità — TTL 5 minuti ──────────
            // PiattoDelGiorno: il gestore li modifica durante il servizio.
            createCacheWithConfig(cm, main.domain.PiattoDelGiorno.class.getName(), hotCacheConfiguration);

            // ── Cache DEFAULT: dati menu (TTL da application.yml) ────────────
            createCache(cm, main.domain.Menu.class.getName());
            createCache(cm, main.domain.Menu.class.getName() + ".portates");
            createCache(cm, main.domain.Menu.class.getName() + ".immaginis");
            createCache(cm, main.domain.Portata.class.getName());
            createCache(cm, main.domain.Portata.class.getName() + ".prodottis");
            createCache(cm, main.domain.ImmagineMenu.class.getName());
            createCache(cm, main.domain.Prodotto.class.getName());
            createCache(cm, main.domain.Prodotto.class.getName() + ".allergenis");
            // jhipster-needle-ehcache-add-entry
        };
    }

    private void createCache(javax.cache.CacheManager cm, String cacheName) {
        javax.cache.Cache<Object, Object> cache = cm.getCache(cacheName);
        if (cache != null) {
            cache.clear();
        } else {
            cm.createCache(cacheName, jcacheConfiguration);
        }
    }

    // OPT-05: overload per registrare una cache con configurazione specifica.
    private void createCacheWithConfig(
        javax.cache.CacheManager cm,
        String cacheName,
        javax.cache.configuration.Configuration<Object, Object> config
    ) {
        javax.cache.Cache<Object, Object> cache = cm.getCache(cacheName);
        if (cache != null) {
            cache.clear();
        } else {
            cm.createCache(cacheName, config);
        }
    }

    @Autowired(required = false)
    public void setGitProperties(GitProperties gitProperties) {
        this.gitProperties = gitProperties;
    }

    @Autowired(required = false)
    public void setBuildProperties(BuildProperties buildProperties) {
        this.buildProperties = buildProperties;
    }

    @Bean
    public KeyGenerator keyGenerator() {
        return new PrefixedKeyGenerator(this.gitProperties, this.buildProperties);
    }
}
