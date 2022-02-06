from flask import Flask, render_template, url_for
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
import json
from flask import request
from flask import jsonify
from sklearn.cluster import KMeans
import matplotlib.pyplot as plt
import matplotlib.style as style
from sklearn.preprocessing import MaxAbsScaler
from sklearn.manifold import MDS

app = Flask(__name__)

attrArr = []


@app.route("/", methods=['POST', 'GET'])
def index():
    global attrArr
    if request.method == 'POST':
        if request.form['request'] == 'screePlot':
            data = {'screePlotData': json.dumps(eigenValuePercent)}
            return jsonify(data)
        elif request.form['request'] == 'topLoading':
            countPCAComponent = int(request.form['countPCAComponent'])
            tmpArr = topLoadingAttributes(countPCAComponent)
            attrArr = tmpArr['attr'].values.tolist()
            data = {'topLoadingData': json.dumps(
                tmpArr.to_dict(orient='records'), indent=2)}
            return jsonify(data)
        elif request.form['request'] == 'scatterPlotMatrix':
            attrArrLocal = attrArr
            attrArrLocal.append("ClusterID")
            spmDF = X_stdDF[attrArrLocal]
            data = {'scatterPlotMatrixData': json.dumps(
                spmDF.to_dict(orient='records'), indent=2)}
            return jsonify(data)
        elif request.form['request'] == 'pcaBiplot':
            pca = PCA(n_components=2)
            components = pca.fit_transform(X_std)
            pcaBiplotDF = pd.DataFrame(data=components, columns=[
                'PC1', 'PC2'])

            # Normalizing [-1,+1]
            scaler = MaxAbsScaler()
            pcaBiplotDF = scaler.fit_transform(pcaBiplotDF)
            pcaBiplotDF = pd.DataFrame(
                data=pcaBiplotDF, columns=['PC1', 'PC2'])
            pcaBiplotDF['ClusterID'] = clusterIDVals

            # print(pcaBiplotDF)

            loadingsPCABiplot = pca.components_.T * \
                np.sqrt(pca.explained_variance_)

            column_names = []
            for i in range(0, 2):
                column_names.append("PC" + str(i + 1))

            # LoadingsMatrix is a correlation matrix between the original variables and Principal Components
            loadingsMatrixPCABiplot = pd.DataFrame(
                loadingsPCABiplot, columns=column_names, index=numericalDF.columns.tolist())
            loadingsMatrixPCABiplot['attr'] = numericalDF.columns.tolist()

            data = {'pcaBiplotDatapoints': json.dumps(
                pcaBiplotDF.to_dict(orient='records'), indent=2), 'pcaBiplotVariablesLoadings': json.dumps(
                loadingsMatrixPCABiplot.to_dict(orient='records'), indent=2)}
            return jsonify(data)
        elif request.form['request'] == 'euclidianMDS':
            data = euclidianMdsDF_final
            # print(data)
            data = json.dumps(data.to_dict(orient='records'), indent=2)
            data = {'euclidianMDSData': data}
            return jsonify(data)
        elif request.form['request'] == 'correlationMDS':
            data = mdsCorrelationDF_final
            # print(data)
            data = json.dumps(data.to_dict(orient='records'), indent=2)
            data = {'correlationMDSData': data}
            return jsonify(data)
        elif request.form['request'] == 'pcp':
            # print(numericalDF.columns.tolist())
            tmpDF = pd.DataFrame(
                numericalDF, columns=numericalDF.columns.tolist())
            tmpDF['ClusterID'] = clusterIDVals
            data = tmpDF
            data = json.dumps(data.to_dict(orient='records'), indent=2)
            data = {'pcpData': data}
            return jsonify(data)
    else:
        return render_template('index.html')


if __name__ == '__main__':
    # Read csv data into dataframe
    df = pd.read_csv('Udemy_Development_Courses_sampled.csv')

    numericalDF = df.drop(['id', 'title', 'url', 'is_paid', 'discount_price_currency',
                           'price_detail_currency', 'avg_rating', 'avg_rating_recent', 'created', 'published_time'], axis=1)

    numericalTmpDF = numericalDF
    # Data Standardization
    X_std = StandardScaler().fit_transform(numericalDF)
    # print(X_std)

    def elbowMethodForOptimalK():
        distortions = []
        K = range(1, 10)
        for k in K:
            kmeans = KMeans(n_clusters=k)
            kmeans.fit(numericalDF)
            # inertia is WSS: Within cluster sum of square
            distortions.append(kmeans.inertia_)

        plt.figure(figsize=(14, 8))
        style.use("fivethirtyeight")
        plt.plot(K, distortions, 'bo-')
        plt.xlabel('Number of clusters (k)')
        plt.ylabel('Distortion')
        plt.title('The Elbow Method')
        plt.savefig('static/images/kmeansElbowMethod_sampled.png')

    # elbowMethodForOptimalK()
    numOfClusters = 2  # from elbow method above

    # K means clustering
    kmeans = KMeans(n_clusters=numOfClusters)
    kmeans.fit(X_std)

    # Cluster IDs
    clusterIDVals = kmeans.labels_

    # Adding ClusterID column to X_std dataframe
    X_stdDF = pd.DataFrame(X_std, columns=numericalDF.columns.tolist())
    X_stdDF['ClusterID'] = clusterIDVals
    # print(X_stdDF)

    # PCA
    pca = PCA()
    components = pca.fit_transform(X_std)
    #print("PCA Completed")

    # For Scree Plot
    eigenValuePercent = [round(i * 100, 2)
                         for i in pca.explained_variance_ratio_]
    #
    # print(eigenValuePercent)

    def topLoadingAttributes(countPCAComponent):
        tlPCA = PCA(n_components=countPCAComponent)
        X_std_new = tlPCA.fit_transform(X_std)

        # Calculating loadings
        loadings = tlPCA.components_.T * np.sqrt(tlPCA.explained_variance_)
        # print(loadings)

        column_names = []
        for i in range(0, countPCAComponent):
            column_names.append("PC" + str(i + 1))

        # LoadingsMatrix is a correlation matrix between the original variables and Principal Components
        loadingsMatrix = pd.DataFrame(
            loadings, columns=column_names, index=numericalDF.columns.tolist())
        # print(loadingsMatrix)
        loadingsSquareMatrix = pd.DataFrame(
            np.square(loadings), columns=column_names, index=numericalDF.columns.tolist())
        # print(loadingsSquareMatrix)
        loadingsMatrix['sum_of_squared_loadings'] = loadingsSquareMatrix.sum(
            axis=1)
        loadingsMatrix['attr'] = numericalDF.columns.tolist()
        # print(loadingsMatrix)
        loadingsMatrixFinal = loadingsMatrix.sort_values(
            'sum_of_squared_loadings', ascending=False)
        print(loadingsMatrixFinal)

        #print(loadingsMatrixFinal[['attr', 'sum_of_squared_loadings']].head(4))
        return loadingsMatrixFinal[['attr', 'sum_of_squared_loadings']].head(4)

    # Euclidian MDS
    euclidianMds = MDS(n_components=2, dissimilarity='euclidean')
    euclidianMds = euclidianMds.fit_transform(X_std)
    euclidianMdsDF = pd.DataFrame(euclidianMds)

    euclidianMdsDF_final = pd.DataFrame()
    euclidianMdsDF_final['x'] = euclidianMdsDF[0]
    euclidianMdsDF_final['y'] = euclidianMdsDF[1]
    euclidianMdsDF_final['ClusterID'] = clusterIDVals

    # Correlation MDS
    correlationMds = MDS(n_components=2, dissimilarity='precomputed')
    mdsDF = pd.DataFrame(X_std)
    # stratifiedtransformdf = stratifiedtransformdf.transpose()
    correlationMatrix = mdsDF.corr()
    for column in correlationMatrix.columns:
        correlationMatrix[column].values[:] = 1 - \
            correlationMatrix[column].values[:]
    mdsCorrelationDF = pd.DataFrame(
        correlationMds.fit_transform(correlationMatrix))

    mdsCorrelationDF_final = pd.DataFrame()
    mdsCorrelationDF_final['x'] = mdsCorrelationDF[0]
    mdsCorrelationDF_final['y'] = mdsCorrelationDF[1]
    mdsCorrelationDF_final['attr'] = numericalDF.columns.tolist()

    app.run(debug=True)
