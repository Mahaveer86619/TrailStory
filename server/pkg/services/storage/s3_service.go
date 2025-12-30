package storage

import (
	"context"
	"fmt"
	"io"

	"github.com/Mahaveer86619/TrailStory/pkg/config"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
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
	// 1. Check if bucket exists
	_, err := s.client.HeadBucket(context.TODO(), &s3.HeadBucketInput{
		Bucket: aws.String(s.bucket),
	})

	// 2. Create if missing
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

	// 3. Apply CORS Policy (Fixes the browser image loading error)
	fmt.Printf("Applying CORS policy to bucket %s...\n", s.bucket)
	_, err = s.client.PutBucketCors(context.TODO(), &s3.PutBucketCorsInput{
		Bucket: aws.String(s.bucket),
		CORSConfiguration: &types.CORSConfiguration{
			CORSRules: []types.CORSRule{
				{
					AllowedHeaders: []string{"*"},
					AllowedMethods: []string{"GET", "PUT", "POST", "DELETE", "HEAD"},
					AllowedOrigins: []string{"*"}, // Allow all origins (localhost, etc.)
					ExposeHeaders:  []string{"ETag"},
					MaxAgeSeconds:  aws.Int32(3000),
				},
			},
		},
	})

	if err != nil {
		return fmt.Errorf("failed to apply CORS policy: %w", err)
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

func (s *S3Storage) SaveProfilePic(userID string, filename string, file io.Reader) (string, error) {
	key := fmt.Sprintf("users/%s/profile_%s", userID, filename)
	_, err := s.client.PutObject(context.TODO(), &s3.PutObjectInput{
		Bucket: &s.bucket,
		Key:    &key,
		Body:   file,
	})
	return key, err
}

func (s *S3Storage) GetPublicURL(storageKey string) string {
	return fmt.Sprintf(
		"%s/%s/%s",
		config.AppConfig.S3_PUBLIC_URL,
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
