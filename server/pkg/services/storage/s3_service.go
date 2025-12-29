package storage

import (
	"context"
	"fmt"
	"io"

	"github.com/Mahaveer86619/TrailStory/pkg/config"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type S3Storage struct {
	client *s3.Client
	bucket string
}

func NewS3Storage(cfg *config.Config) *S3Storage {
	awsCfg := aws.Config{
		Region: cfg.S3_REGION,
		Credentials: credentials.NewStaticCredentialsProvider(
			cfg.S3_ACCESS_KEY,
			cfg.S3_SECRET_KEY,
			"",
		),
		EndpointResolverWithOptions: aws.EndpointResolverWithOptionsFunc(
			func(service, region string, _ ...interface{}) (aws.Endpoint, error) {
				return aws.Endpoint{
					URL:               cfg.S3_ENDPOINT,
					HostnameImmutable: true,
				}, nil
			},
		),
	}

	client := s3.NewFromConfig(awsCfg)

	return &S3Storage{
		client: client,
		bucket: cfg.S3_BUCKET,
	}
}

func (s *S3Storage) Init() error {
	// Check if bucket exists
	_, err := s.client.HeadBucket(context.TODO(), &s3.HeadBucketInput{
		Bucket: aws.String(s.bucket),
	})

	if err != nil {
		fmt.Printf("Bucket %s not found, attempting to create...\n", s.bucket)
		_, err = s.client.CreateBucket(context.TODO(), &s3.CreateBucketInput{
			Bucket: aws.String(s.bucket),
		})
		if err != nil {
			return fmt.Errorf("failed to auto-create bucket: %w", err)
		}
		fmt.Printf("Bucket %s created successfully.\n", s.bucket)
	}

	return nil
}

func (s *S3Storage) SaveMedia(
	journeyID string,
	checkpointID string,
	filename string,
	file io.Reader,
) (string, error) {

	key := fmt.Sprintf(
		"journeys/%s/checkpoints/%s/%s",
		journeyID,
		checkpointID,
		filename,
	)

	_, err := s.client.PutObject(context.TODO(), &s3.PutObjectInput{
		Bucket: &s.bucket,
		Key:    &key,
		Body:   file,
	})

	if err != nil {
		return "", err
	}

	return key, nil
}

func (s *S3Storage) GetPublicURL(storageKey string) string {
	return fmt.Sprintf(
		"%s/%s/%s",
		config.AppConfig.S3_ENDPOINT,
		s.bucket,
		storageKey,
	)
}

func (s *S3Storage) HealthCheck() error {
	_, err := s.client.HeadBucket(context.TODO(), &s3.HeadBucketInput{
		Bucket: &s.bucket,
	})
	return err
}
