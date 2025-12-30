package storage

import (
	"io"

	"github.com/Mahaveer86619/TrailStory/pkg/config"
)

type StorageService interface {
	Init() error

	SaveMedia(
		journeyID string,
		checkpointID string,
		filename string,
		file io.Reader,
	) (string, error)

	SaveProfilePic(userID string, filename string, file io.Reader) (string, error)
	
	GetPublicURL(storageKey string) string

	HealthCheck() error
}

func NewStorageService() StorageService {
	cfg := config.AppConfig

	switch cfg.STORAGE_DRIVER {
	case "s3":
		return NewS3Storage(&cfg)
	case "local":
		fallthrough
	default:
		return NewLocalStorage(cfg.STORAGE_PATH)
	}
}
