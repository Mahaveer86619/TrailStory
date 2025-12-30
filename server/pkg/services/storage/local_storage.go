package storage

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
)

type LocalStorage struct {
	basePath string
}

func NewLocalStorage(basePath string) *LocalStorage {
	if basePath == "" {
		basePath = "./uploads"
	}
	return &LocalStorage{basePath: basePath}
}

func (s *LocalStorage) Init() error {
	return os.MkdirAll(s.basePath, 0755)
}

/*

Storing Format ->

uploads/
  journeys/{journey_id}/
    checkpoints/{checkpoint_id}/
      original.jpg

*/

func (s *LocalStorage) SaveMedia(
	journeyID string,
	checkpointID string,
	filename string,
	file io.Reader,
) (string, error) {

	dir := filepath.Join(
		s.basePath,
		"journeys",
		journeyID,
		"checkpoints",
		checkpointID,
	)

	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", err
	}

	dstPath := filepath.Join(dir, filename)

	out, err := os.Create(dstPath)
	if err != nil {
		return "", err
	}
	defer out.Close()

	if _, err := io.Copy(out, file); err != nil {
		return "", err
	}

	// storageKey is relative path
	storageKey, _ := filepath.Rel(s.basePath, dstPath)

	return storageKey, nil
}

func (s *LocalStorage) SaveProfilePic(userID string, filename string, file io.Reader) (string, error) {
	dir := filepath.Join(s.basePath, "users", userID)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", err
	}
	dstPath := filepath.Join(dir, filename)
	out, err := os.Create(dstPath)
	if err != nil {
		return "", err
	}
	defer out.Close()
	if _, err := io.Copy(out, file); err != nil {
		return "", err
	}
	return filepath.Rel(s.basePath, dstPath)
}

func (s *LocalStorage) GetPublicURL(storageKey string) string {
	// For local dev, this might be served via a static handler
	return fmt.Sprintf("/static/%s", storageKey)
}

func (s *LocalStorage) HealthCheck() error {
	_, err := os.Stat(s.basePath)
	return err
}
