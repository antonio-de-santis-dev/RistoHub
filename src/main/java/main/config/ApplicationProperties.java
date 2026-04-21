package main.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Properties specific to Risto Hub.
 * <p>
 * Properties are configured in the {@code application.yml} file.
 * See {@link tech.jhipster.config.JHipsterProperties} for a good example.
 */
@ConfigurationProperties(prefix = "application", ignoreUnknownFields = false)
public class ApplicationProperties {

    private final Liquibase liquibase = new Liquibase();
    private final Deepl deepl = new Deepl();

    // jhipster-needle-application-properties-property

    public Liquibase getLiquibase() {
        return liquibase;
    }

    public Deepl getDeepl() {
        return deepl;
    }

    // jhipster-needle-application-properties-property-getter

    public static class Liquibase {

        private Boolean asyncStart = true;

        public Boolean getAsyncStart() {
            return asyncStart;
        }

        public void setAsyncStart(Boolean asyncStart) {
            this.asyncStart = asyncStart;
        }
    }

    /**
     * Configurazione per l'integrazione con DeepL API.
     * L'API key va messa in application.yml (profilo dev/prod) o come variabile d'ambiente.
     * Se la key è vuota/null, il servizio di traduzione non chiama DeepL e ritorna
     * stringhe vuote (fallback silenzioso).
     */
    public static class Deepl {

        private String apiKey = "";
        private Boolean enabled = false;
        private Integer timeoutSeconds = 10;

        public String getApiKey() {
            return apiKey;
        }

        public void setApiKey(String apiKey) {
            this.apiKey = apiKey;
        }

        public Boolean getEnabled() {
            return enabled;
        }

        public void setEnabled(Boolean enabled) {
            this.enabled = enabled;
        }

        public Integer getTimeoutSeconds() {
            return timeoutSeconds;
        }

        public void setTimeoutSeconds(Integer timeoutSeconds) {
            this.timeoutSeconds = timeoutSeconds;
        }
    }
    // jhipster-needle-application-properties-property-class
}
